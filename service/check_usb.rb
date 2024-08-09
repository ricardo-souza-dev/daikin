#!/usr/bin/ruby
#coding: utf-8

#system('dmesg | grep ttyUSB0 | tail -n 1')
val = `dmesg | grep ttyUSB0 | tail -n 1`
puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
puts "#{val}"
