#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

list = JSON.parse(cgi['data'])

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('device_list.json','w') do |io|
		list.each do |dev|
			io.puts(JSON.generate(dev))
		end
	end
	puts "OK"
rescue => e
	puts "NG #{e}"
end
