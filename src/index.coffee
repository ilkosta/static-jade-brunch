jade    = require 'jade'
sysPath = require 'path'
mkdirp  = require 'mkdirp'
fs      = require 'fs'

# for the check of jade-brunch and notification of errors
helpers = require 'brunch/lib/helpers'
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
  #relativeFilePath = relativeFilePath[1..]
  #relativeFilePath.unshift publicPath
  newpath = sysPath.join.apply this, relativeFilePath
  return newpath

htmlFileWriter = (newFilePath) -> (err, content) ->
  throw err if err?
  return if not content?
  dirname = sysPath.dirname newFilePath
  mkdirp dirname, '0775', (err) ->
    throw err if err?
    fs.writeFile newFilePath, content, (err) ->
      throw err if err?

isFileToCompile = (filePath) ->
  fileName = (filePath.split sysPath.sep).pop()
  /^(?!_).+\.jade/.test fileName


module.exports = class StaticJadeCompiler
  brunchPlugin: yes
  type: 'template'
  extension: 'jade'

  constructor: (@config) ->
    # static-jade-brunch must co-exist with jade-brunch plugin
    helpers.loadPackages helpers.pwd(), (error, packages) ->
      throw error if error?
      if "JadeCompiler" not in (p.name for p in packages)
        error = "`jade-brunch` plugin needed by `static-jade-brunch` doesn't seems to be present."
        errmsg = """
          * Check that package.json contain the `jade-brunch` plugin
          * Check that it is correctly installed by using `npm list`"""
        console.log color error, "red"
        console.log color errmsg, "red"
        growl error , title: 'Brunch plugin error'
        throw error

  onCompile: (changedFiles) ->
    config = @config
    changedFiles.every (file) ->
      filesToCompile = (f.path for f in file.sourceFiles when isFileToCompile f.path)
      fromJade2Html jadeFileName, config, htmlFileWriter getHtmlFilePath jadeFileName, config.paths.public for jadeFileName in filesToCompile
