#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

holiday = {'holidayprice'=>false}
begin
	File.open('holiday.json','r') do |io|
		line = io.gets
		holiday = JSON.load(line)
	end
rescue
end

puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(holiday)}"
