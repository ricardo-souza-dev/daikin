#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('mail_server.json','w') do |io|
		io.puts(cgi['data'])
	end
	File.chmod(0777,'mail_server.json')
	puts "OK"
rescue => e
	puts "NG"
end
