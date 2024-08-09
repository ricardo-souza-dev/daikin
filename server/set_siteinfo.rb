#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

site_info = JSON.parse(cgi['data'])

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('site_info.json','w') do |io|
		io.puts(JSON.generate(site_info))
	end
	File.chmod(0666,'site_info.json')
	puts "OK"
rescue => e
	puts "NG #{e}"
end
