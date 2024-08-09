#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

option = {}
clock = ['internet',true]
ppd = false
ppd = true if(cgi['ppd_enable'] == 'true')
option['ppd_enable'] = ppd
prepaied = false
prepaied = true if(cgi['prepaied_enable'] == 'true')
option['prepaied_enable'] = prepaied
clock[0] = cgi['clock_sync'] if(cgi['clock_sync'].empty? == false && cgi['clock_sync'] != nil)
msm = false
msm = true if(cgi['msm'] == 'true')
option['msm'] = msm
hotel = false
hotel = true if(cgi['hotel'] == 'true')
option['hotel'] = hotel
dbman = false
dbman = true if(cgi['data'] == 'true')
option['data'] = dbman
bei = false
bei = true if(cgi['bei'] == 'true')
option['bei'] = bei

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('option.json','w') do |io|
		io.puts(JSON.generate(option))
	end
	File.chmod(0666,'option.json')
	File.open('clock_adjust.json','w') do |io|
		io.puts(JSON.generate(clock))
	end
	puts "OK"
rescue => e
	puts "NG"
end
File.chmod(0666,'clock_adjust.json')
