#!/usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'
require_relative 'HostNetworkInfo'

cgi = CGI.new
#ip = cgi['ipaddr']
#netmask = cgi['netmask']
#gateway = cgi['gateway']
#dns = cgi['dns']
#wifi = cgi['wifi']
#dhcp = cgi['dhcp']

info = HostNetworkInfo.new
puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
if(info.set_network(cgi) == true)
	puts "OK"
else
	puts "NG"
end
