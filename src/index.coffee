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
    @rootPath     = @config.plugins?.static_jade?.rootPath ? 'app'
    options      = @config.plugins?.jade?.options \
                      or @config.plugins?.jade \
                      or {}

    @options = clone options

    mkdirp.sync @relAssetPath


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
    rootFilePathParts = @rootPath.split sysPath.sep
    pathStartIdx = rootFilePathParts.length
    relativeFilePath =
      sysPath.join.apply this, relativeFilePathParts[pathStartIdx...]
    newpath = sysPath.join relAssetPath, relativeFilePath
    return newpath

  fromJade2Html: (jadeFilePath, callback) ->
    options = @options
    locals = clone @locals
    try
      fs.readFile jadeFilePath, (err,data) =>
        if err
          throw err

        @options.filename = jadeFilePath
        @options.basedir = sysPath.join '.', 'app'
        locals.filename = jadeFilePath.replace(new RegExp('^'+@options.basedir+'/'), '')

        fn = jade.compile data,
          @options

        callback err, fn(locals)
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
