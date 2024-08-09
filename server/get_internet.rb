#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

internet = {'connect'=>false,
#				'host'=>'sis-sin.ddns.net',
				'host'=>'sis-br.ddns.net',
				'port'=>50000}
begin
	File.open('sis.json','r') do |io|
		line = io.gets
		internet = JSON.load(line)
	end
rescue
end

puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(internet)}"
