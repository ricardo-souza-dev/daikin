#!/usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new
time_zone = cgi['tzone']

com = "sudo ln -sf /usr/share/zoneinfo/#{time_zone} /etc/localtime"
puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
if(system(com) == true)
	com = "sudo /usr/bin/timedatectl set-timezone #{time_zone}; sudo echo '#{time_zone}' > /etc/timezone"
	system(com)
	puts "OK"
else
	puts "NG"
end

