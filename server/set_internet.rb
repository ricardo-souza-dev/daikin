#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

val = false
val = true if(cgi['connect'] == 'true')
internet = {'connect'=>val,
#				'host'=>'sis-sin.ddns.net',
				'host'=>'sis-br.ddns.net',
#				'host'=>'sis-us.ddns.net',
				'port'=>50001}

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('sis.json','w') do |io|
		io.puts(JSON.generate(internet))
	end
#	File.chmod(0666,'sis.json')
	puts "OK"
rescue => e
	puts "NG"
end
