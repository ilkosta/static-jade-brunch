[![build status](https://secure.travis-ci.org/ilkosta/static-jade-brunch.png)](http://travis-ci.org/ilkosta/static-jade-brunch)

## static-jade-brunch
Adds [Jade](http://jade-lang.com) support to [brunch](http://brunch.io) without wrapping the compiled html in modules of type commonjs/amd. 
Each jade file that don't start with `_` (underscore) is compiled in `public/`.

## Usage 
Add `"jade-brunch": "x.y.z"` and `"static-jade-brunch": "x.y.z"` to `package.json` of your brunch app.

**Pick a plugin version that corresponds to your minor (y) brunch version.**

If you want to use git version of plugin, add
`"jade-brunch": "git+ssh://git@github.com:brunch/jade-brunch.git"`
`"static-jade-brunch": "git+ssh://git@github.com:ilkosta/static-jade-brunch.git"`

## License
Copyright (c) 2012 "ilkosta" Costantino Giuliodori.

Licensed under the [MIT license](https://github.com/ilkosta/static-jade-brunch/blob/master/LICENSE-MIT).