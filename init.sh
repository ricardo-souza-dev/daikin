#!/bin/sh
apachectl -D FOREGROUND
ruby -C/var/www/html/server svm.rb