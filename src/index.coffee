jade    = require 'jade'
sysPath = require 'path'
mkdirp  = require 'mkdirp'
fs      = require 'fs'

# for the notification of errors
color   = require("ansi-color").set
growl   = require 'growl'

fromJade2Html = (jadeFilePath, config, callback) ->
  try
    fs.readFile jadeFilePath, (err,data) ->
      content = jade.compile data,
        compileDebug: no,
        filename: jadeFilePath,
        pretty: !!config.plugins?.jade?.pretty
      foo = () ->
      res = content(foo)
      callback err, res
  catch err
    callback err

getHtmlFilePath = (jadeFilePath, publicPath) ->
  # placing the generated files in 'asset' dir,
  # brunch would trigger the auto-reload-brunch only for them
  # without require to trigger the plugin from here
  relativeFilePath = jadeFilePath.split sysPath.sep
  relativeFilePath.push relativeFilePath.pop()[...-5] + ".html"
  relativeFilePath.splice 1, 0, "assets"
  newpath = sysPath.join.apply this, relativeFilePath
  return newpath

logError = (err, title) ->
  title = 'Brunch jade error' if not title?
  if err?
    console.log color err, "red"
    growl err , title: title
      
fileWriter = (newFilePath) -> (err, content) ->
  throw err if err?
  return if not content?
  dirname = sysPath.dirname newFilePath
  mkdirp dirname, '0775', (err) ->
    throw err if err?
    fs.writeFile newFilePath, content, (err) -> throw err if err?

isFileToCompile = (filePath) ->
  fileName = (filePath.split sysPath.sep).pop()
  /^(?!_).+\.jade/.test fileName


# -------------------- from brunch/lib/helpers --------------------------------
extend = (object, properties) ->
  Object.keys(properties).forEach (key) ->
    object[key] = properties[key]
  object

loadPackages = (rootPath, callback) ->
  rootPath = sysPath.resolve rootPath
  nodeModules = "#{rootPath}/node_modules"
  fs.readFile sysPath.join(rootPath, 'package.json'), (error, data) ->
    return callback error if error?
    json = JSON.parse(data)
    deps = Object.keys(extend(json.devDependencies ? {}, json.dependencies))
    try
      plugins = deps.map (dependency) -> require "#{nodeModules}/#{dependency}"
    catch err
      error = err
    callback error, plugins
#------------------------------------------------------------------------------


module.exports = class StaticJadeCompiler
  brunchPlugin: yes
  type: 'template'
  extension: 'jade'

  constructor: (@config) ->
    # static-jade-brunch must co-exist with jade-brunch plugin
    loadPackages process.cwd(), (error, packages) ->
      throw error if error?
      if "JadeCompiler" not in (p.name for p in packages)
        error = """
          `jade-brunch` plugin needed by `static-jade-brunch` \
          doesn't seems to be present.
          """
        logError error, 'Brunch plugin error'
        errmsg = """
          * Check that package.json contain the `jade-brunch` plugin
          * Check that it is correctly installed by using `npm list`"""
        console.log color errmsg, "red"
        throw error

  onCompile: (changedFiles) ->
    config = @config
    changedFiles.every (file) ->
      filesToCompile =
        f.path for f in file.sourceFiles when isFileToCompile f.path
      publicPath = config.paths.public
      for jadeFileName in filesToCompile
        newFilePath = getHtmlFilePath jadeFileName, publicPath
        try
          fromJade2Html jadeFileName, config, fileWriter newFilePath
        catch err
          logError err
          null
