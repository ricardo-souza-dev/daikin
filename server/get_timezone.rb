#!/usr/bin/ruby
#coding: utf-8

zone_info = ''
if(RUBY_PLATFORM.index("linux"))
	info = `timedatectl | grep 'Time zone'`
	zone_info = info.split(':')[1].split(' ')[0]
end

puts "Content-type: text/html; charset=utf-8\r\n\r\n"
puts zone_info
