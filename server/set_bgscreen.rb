#!/usr/bin/ruby

require 'cgi'

cgi = CGI.new
img = cgi.params

puts "Content-type: text/html; charset=utf-8\n\n"
begin
	img.each do |name,file|
		open('../screen/'+name,'w') do |io|
			io.binmode
			io.write(file[0].read)
		end
	end
	puts "OK"
rescue => e
	puts "NG: #{e}"
end

