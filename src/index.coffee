jade    = require 'jade'
sysPath = require 'path'
mkdirp  = require 'mkdirp'
fs      = require 'fs'

# for the notification of errors
color   = require('ansi-color').set
growl   = require 'growl'

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

clone = (obj) ->
  return obj  if null is obj or "object" isnt typeof obj
  copy = obj.constructor()
  for attr of obj
    copy[attr] = obj[attr]  if obj.hasOwnProperty(attr)
  copy


module.exports = class StaticJadeCompiler
  brunchPlugin: yes
  type: 'template'
  extension: ".jade"

  constructor: (@config) ->
    @locals       = @config.plugins?.jade?.locals or () ->
    @extension    = @config.plugins?.static_jade?.extension ? ".jade"
    @relAssetPath = @config.plugins?.static_jade?.asset ? "app/assets"
    options      = @config.plugins?.jade?.options \
                      or @config.plugins?.jade \
                      or {}

    @options = clone options

    mkdirp.sync @relAssetPath

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
        positivePaths = (
          p for p in @config.plugins.static_jade.path when p.test fileDir)
        return no if positivePaths.length == 0

    fileName = sysPath.basename filePath
    fileName[-@extension.length..] == @extension

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

  fromJade2Html: (jadeFilePath, callback) ->
    options = @options
    try
      fs.readFile jadeFilePath, (err,data) =>
        if err
          throw err

        @options.filename = jadeFilePath

        fn = jade.compile data,
          @options

        callback err, fn(@locals)
    catch err
      callback err

  onCompile: (changedFiles) ->
    changedFiles.every (file) =>
      filesToCompile =
        f.path for f in file.sourceFiles when @isFileToCompile f.path
      for jadeFileName in filesToCompile
        newFilePath = @getHtmlFilePath jadeFileName, @relAssetPath
        try
          @fromJade2Html jadeFileName, fileWriter newFilePath
        catch err
          logError err
          null
