#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'
require 'net/https'

cgi = CGI.new

key = cgi['key'];
accesskey = ''
host = ''
begin
	File.open('accesskey.jsonp','r') do |io|
		accesskey = io.gets	# access key information
	end
	File.open('sis.json','r') do |io|
		host = JSON.load(io.gets)['host']
	end
rescue => e
end

# send access key information with key to SIS
uri = URI.parse('https://'+host+'/accesskey/accesskey_controller.rb')
https = Net::HTTP.new(uri.host,uri.port)
https.use_ssl = true
req = Net::HTTP::Post.new(uri.path)
req.set_form_data({'key'=>key+'.jsonp','accesskey'=>accesskey})
res = https.request(req)

puts "Content-type: text/plain; charset=utf-8\r\n\r\n"
if(res.body.include?("OK"))
	puts "OK"
else
	puts "NG"
end
