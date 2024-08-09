#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

cgi = CGI.new

adaptor1 = ["Dta116",1,{"address"=>1,"port"=>"/dev/ttyUSB0","speed"=>19200,"parity"=>"EVEN","stopbit"=>1}]
adaptor2 = ["Dta116C",1,{"address"=>1,"port"=>"/dev/ttyUSB0","speed"=>19200,"parity"=>"EVEN","stopbit"=>1}]

val = false
val = true if(cgi['china'] == 'true')

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
begin
	File.open('device_list.json','w') do |io|
		io.puts(JSON.generate(adaptor1)) if(val == false)
		io.puts(JSON.generate(adaptor2)) if(val == true)
	end
	puts "OK"
rescue => e
	puts "NG #{e}"
end
