#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

screen_list = JSON.parse(cgi['data'])

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('screen_list.json','w') do |io|
		io.puts(JSON.generate(screen_list))
	end
	File.chmod(0777,'screen_list.json')
	puts "OK"
rescue => e
	puts "NG #{e}"
end
