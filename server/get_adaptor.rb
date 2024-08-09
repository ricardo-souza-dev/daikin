#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

adaptors = 0
begin
	File.open('device_list.json','r') do |io|
		while(line = io.gets)
			next if(line.strip.length == 0)
			next if(line[0] == '#')
			begin
				info = JSON.load(line)
				adaptors += 1 if(info[0] == 'Dta116')
			rescue
			end
		end
	end
rescue
end

ret = {'adaptors'=>adaptors}
puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(ret)}"
