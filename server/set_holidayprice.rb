#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

val = false
val = true if(cgi['holidayprice'] == 'true')
holiday = {'holidayprice'=>val}

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('holiday.json','w') do |io|
		io.puts(JSON.generate(holiday))
	end
	File.chmod(0777,'holiday.json')
	puts "OK"
rescue => e
	puts "NG"
end
