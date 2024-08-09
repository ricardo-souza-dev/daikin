#coing: utf-8

require_relative 'MSio'

class MSiItm < MSi
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@tag[0] = attr[8]
		@tag[1] = attr[9]
		@tag[2] = attr[10]
		@tag[3] = attr[11]
		@tag[4] = attr[12]
		@tag[5] = attr[13]
		@tag[6] = attr[14]
		@tag[7] = attr[15]
		@tag[8] = attr[16]
		@tag[9] = attr[17]
	end
end

class MSoItm < MSo
	def set_dev_attr(attr)
		@ppd_target = true if(attr[3] == 0)
		@tag[0] = attr[9]
		@tag[1] = attr[10]
		@tag[2] = attr[11]
		@tag[3] = attr[12]
		@tag[4] = attr[13]
		@tag[5] = attr[14]
		@tag[6] = attr[15]
		@tag[7] = attr[16]
		@tag[8] = attr[17]
		@tag[9] = attr[18]
	end		
end