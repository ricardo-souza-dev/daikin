#!/usr/bin/ruby

require 'cgi'

cgi = CGI.new
csv = cgi.params['room-list'][0]

puts "Content-type: text/html; charset=utf-8\n\n"

data = ''
begin
  open('room_list.csv','w') do |file|
  	file.write(csv.read)
		file.write(data)
  end
  puts "OK"
rescue
  puts "NG"
end
