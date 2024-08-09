#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'
require_relative 'HostNetworkInfo'
ssid = ''
pin = ''
if(RUBY_PLATFORM.index("linux"))
	path = HostNetworkInfo.wpa_path
	
	File.open(path, "r") do |f|
		f.each_line do |line|
			if(line.index("ssid="))
				info = line.split("=")
				ssid = info[1].gsub('"','').strip 
			elsif(line.index("psk="))
				info = line.split("=")
				pin = info[1].gsub('"','').strip 
			end
		end
	end
end

info = {'ssid'=>ssid,'pin'=>pin}
puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(info)}"

#info is {'ssid'=>ssid,'pin'=>pin}