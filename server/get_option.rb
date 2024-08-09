#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

option = {'ppd_enable'=>false,'msm'=>false,'hotel'=>false}
clock = ['internet',true]
begin
	File.open('option.json','r') do |io|
		line = io.gets
		option = JSON.load(line)
	end
	File.open('clock_adjust.json') do |io|
		line = io.gets
		info = JSON.load(line)
		clock[0] = info[0] if(info[0] == 'internet' || info[0] == 'itm')
		clock[1] = info[1] if(info[0] == true || info[0] == false)
	end
	option['clock_sync'] = clock[0]
rescue
end

puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(option)}"
