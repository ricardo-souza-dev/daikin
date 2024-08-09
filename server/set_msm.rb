#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

val = false
val = true if(cgi['msm'] == 'true')
msm = {'msm'=>val}

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('msm.json','w') do |io|
		io.puts(JSON.generate(msm))
	end
	File.chmod(0666,'msm.json')
	puts "OK"
rescue => e
	puts "NG"
end
