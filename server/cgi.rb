# coding: utf-8

require 'net/https'
require 'uri'

def postFile(host,target,id,path,files)	# file is File object
	uri = URI.parse('https://'+host+target)
	begin
		http = Net::HTTP.new(uri.host,uri.port)
		http.use_ssl = true
		req = Net::HTTP::Post.new(uri.path)

		data = [["site_id",id]]
		files.each do |name|
			file = File.new(path+'/'+name)
			data.push([name,file])
		end
		req.set_form(data,'multipart/form-data')
		res = http.request(req)
		return true if(res.body.include?('OK'))
	end
	return false
end

#files = ['image1.png','image2.png']
#uri = URI.parse('https://'+'sis-sin.ddns.net'+'/screen/ReceiveScreen.rb')
#postFile(uri,'aaa','../screen',files)