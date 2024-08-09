#!/usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'
require_relative 'HostNetworkInfo'

def set_wifi(ssid,pin)
	path = HostNetworkInfo.wpa_path

	begin
		File.open(path, "w") do |f|
			f.puts "country=SG"
			f.puts "ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev"
			f.puts "update_config=1"
			
			f.puts "network={"
			f.puts "ssid=\"#{ssid}\""
			if(pin.length > 0) 
				f.puts "psk=\"#{pin}\""
			else
				f.puts "key_mgmt=NONE"
			end
			f.puts "}"
		end
	rescue
		return false
	end
	return true
end

cgi = CGI.new
ssid = cgi['ssid']
pin = cgi['pin']

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
if(set_wifi(ssid,pin) == true)
	puts "OK"
else
	puts "NG"
end

