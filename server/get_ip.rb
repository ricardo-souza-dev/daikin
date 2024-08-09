#! /usr/bin/ruby
#coding: utf-8

require 'cgi'
require 'json'
require_relative 'HostNetworkInfo'

network = HostNetworkInfo.new
info = network.get_network_info
puts "Content-type: application/json; charset=utf-8\r\n\r\n"
puts "#{JSON.generate(info)}"
