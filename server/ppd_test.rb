#coding: utf-8

require_relative 'Itm'

class Db
	def store_ppd(time,data)
		puts Time.at(time)
		data.each do |id, ppd|
			puts "#{id}: #{ppd[0]} #{ppd[1]}"
		end
	end
end

itm = Itm.new(1,Db.new)
itm.set_attribute({'ip_addr'=>'192.168.10.2','port'=>8081,'user'=>'svm','passwd'=>'svm'})
itm.ppd_id_list << 151 << 152
from = Time.new(2015,2,19,11)
itm.req_ppd(from)
