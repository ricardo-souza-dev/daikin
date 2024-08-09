#!/usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

info = {}
begin
	File.open('site_info.json','r') do |io|
		line = io.gets
		info = JSON.load(line)
	end
rescue
end

puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(info)}"
