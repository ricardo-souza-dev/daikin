#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'

server = {'active'=>false,
				'address'=>'smtp.gmail.com',
				'domain'=>'smtp.gmail.com',
				'port'=>587}
begin
	File.open('mail_server.json','r') do |io|
		line = io.gets
		server = JSON.load(line)
	end
rescue
end

puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(server)}"
