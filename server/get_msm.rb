#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

msm = {'msm'=>false}
begin
	File.open('msm.json','r') do |io|
		line = io.gets
		msm = JSON.load(line)
	end
rescue
end

puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(msm)}"
