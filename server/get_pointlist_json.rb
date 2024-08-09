#!/usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

def load_points
	point_list = {}	# initialize point list
	begin
		File.open("point_list.json","r:UTF-8") do |io|
			while(line = io.gets)
				next if(line.strip.length == 0)
				begin
					info = JSON.load(line)
					point_list[info[1]['id']] = info[1]
				rescue => e
					puts "Fail to load point #{e.backtrace}"
					puts "======= #{e}"
				end
			end
		end
		return point_list
	rescue => e
		puts "Warning: #{e}"
	end
end

puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts JSON.generate(load_points)
