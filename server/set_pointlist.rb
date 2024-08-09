#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

list = JSON.parse(cgi['data'])

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('point_list.json','w') do |io|
		list.each do |point|
			io.puts(JSON.generate(point))
		end
	end

	# backup file
	File.open('point_list.bak.json','w') do |io|
		list.each do |point|
			io.puts(JSON.generate(point))
		end
	end

	puts "OK"
rescue => e
	puts "NG #{e}"
end
