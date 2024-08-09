#!/usr/bin/ruby

require 'cgi'

cgi = CGI.new
img = cgi.params['image'][0]

puts "Content-type: text/html; charset=utf-8\n\n"

begin
	open('../BillHeader.png','w') do |file|
		file.binmode
		file.write(img.read)
	end
	puts "OK"
rescue
	puts "NG"
end

