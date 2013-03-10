# static-jade-brunch 1.4.11 (March 10, 2013)
* added the possibility to configure all the options of the jade compiler as requested:  https://github.com/ilkosta/static-jade-brunch/issues/6

# static-jade-brunch 1.4.10 (November 1, 2012)
* added the possibility to configure the `asset` output directory to fix the problem in https://github.com/ilkosta/static-jade-brunch/commit/af05afada09eed4dfce2a820af28051f1a1fa046#commitcomment-2074956

# static-jade-brunch 1.4.9 (October 15, 2012)
* added the possibility to filter by extension or directory as in https://github.com/ilkosta/static-jade-brunch/pull/4

# static-jade-brunch 1.4.8 (October 4, 2012)
* reverted changes from 1.4.5 for the check of the jade-brunch plugin cohexistence

# static-jade-brunch 1.4.7 (October 1, 2012)
* published the compiled file index.js

# static-jade-brunch 1.4.6 (September 21, 2012)
* moved the jade-brunch check from the plugin constructor to module loading

# static-jade-brunch 1.4.5 (September 19, 2012)
* fixed the throw for jade and fs.write errors

# static-jade-brunch 1.4.4 (September 18, 2012)
* eliminated the brunch dependency, needed for the check of others plugins

# static-jade-brunch 1.4.2 (September 18, 2012)
* eliminated the copy in `assets/` of files starting with `_` (underscore)

# static-jade-brunch 1.4.1 (September 18, 2012)
* tested inside angular-brunch-seed
* checked the existence of jade-brunch
* abitility to co-exists with auto-reload-brunch by saving compiled files in `assets/` dir

# static-jade-brunch 1.4.0 (September 13, 2012)
* Initial release... not really good
