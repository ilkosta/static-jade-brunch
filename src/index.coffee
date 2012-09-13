jade    = require 'jade'
sysPath = require 'path'
mkdirp  = require 'mkdirp'
fs      = require 'fs'

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
  relativeFilePath = jadeFilePath.split sysPath.sep
  relativeFilePath.push relativeFilePath.pop()[...-5] + ".html"
  relativeFilePath = relativeFilePath[1..]
  relativeFilePath.unshift publicPath
  newpath = sysPath.join.apply this, relativeFilePath
  return newpath

htmlFileWriter = (htmlFilePath) -> (err,content) ->
  throw err if err?
  return if not content?
  dirname = sysPath.dirname htmlFilePath
  mkdirp dirname, '0775', (err) ->
    throw err if err?
    fs.writeFile htmlFilePath, content, (err) ->
      throw err if err?

haveJadeExt = (filePath) -> filePath[-5...] is '.jade'

module.exports = class StaticJadeCompiler
  brunchPlugin: yes
  type: 'template'
  extension: 'jade'

  constructor: (@config) ->
    # static-jade-brunch must coexist with jade-brunch plugin
    null

  onCompile: (changedFiles) ->
    config = @config
    changedFiles.every (file) ->
      filesToCompile = (f.path for f in file.sourceFiles when haveJadeExt f.path)
      fromJade2Html jadeFileName, config, htmlFileWriter getHtmlFilePath jadeFileName, config.paths.public for jadeFileName in filesToCompile
