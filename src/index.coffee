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


isArray = (obj) ->
 !!(obj and obj.concat and obj.unshift and not obj.callee)

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
  extension: ".jade"

  constructor: (@config) ->
    @extension    = @config.plugins?.static_jade?.extension ? ".jade"
    @relAssetPath = @config.plugins?.static_jade?.asset ? "app/assets"
    mkdirp.sync @relAssetPath
    StaticJadeCompiler::extension = @extension
    StaticJadeCompiler::config = @config

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

  isFileToCompile: (filePath) ->
    if (@config.plugins?.static_jade?.path?)
      if isArray @config.plugins.static_jade.path
        fileDir = sysPath.dirname filePath
        positivePaths = (p for p in @config.plugins.static_jade.path when p.test fileDir)
        return no if positivePaths.length == 0

    fileName = sysPath.basename filePath
    fileName[-@extension.length..] == @extension

  # This function uses objects defined in config to ensure that jade files that have dependencies (using jade include)
  # will get compiled when their dependencies change, and that partials do not get compiled to
  # the assets directory as well. The config objects are called 'pages' containing properties 'main' defining the file 
  # to be compiled and 'dependencies' (included partials) to fire the watcher and compile the main file. 
  getFilesToCompile: (jadeFiles) ->
    filesToCompile = []
    pages          = @config.plugins.static_jade.pages
    for file in jadeFiles
      isDependency = false
      for page in pages
        if page.dependencies?(file) or page.dependencies.exec? file
          isDependency = true
          filesToCompile.push(page.main) unless page.main in filesToCompile

      filesToCompile.push(file) if not isDependency and file not in filesToCompile

    filesToCompile


  getHtmlFilePath: (jadeFilePath, relAssetPath) ->
    util = require 'util'
    # placing the generated files in 'asset' dir,
    # brunch would trigger the auto-reload-brunch only for them
    # without require to trigger the plugin from here
    relativeFilePathParts = jadeFilePath.split sysPath.sep
    relativeFilePathParts.push(
      relativeFilePathParts.pop()[...-@extension.length] + ".html" )
    relativeFilePath = sysPath.join.apply this, relativeFilePathParts[1...]
    newpath = sysPath.join relAssetPath, relativeFilePath
    return newpath

  onCompile: (changedFiles) ->
    changedFiles.every (file) =>
      jadeFiles =
        f.path for f in file.sourceFiles when StaticJadeCompiler::isFileToCompile f.path
      filesToCompile = @getFilesToCompile jadeFiles
      for jadeFileName in filesToCompile
        newFilePath = StaticJadeCompiler::getHtmlFilePath jadeFileName, @relAssetPath
        try
          fromJade2Html jadeFileName, @config, fileWriter newFilePath
        catch err
          logError err
          null
