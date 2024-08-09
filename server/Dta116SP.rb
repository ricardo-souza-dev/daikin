#coding: utf-8

require_relative 'Dta116'

class Dta116SP < Dta116
	# convert bitmap information of id to array
	# bitmap is [0xffff,0xffff,0xffff,0xffff]
	# array is 1 to 64
	# ID 1 activate 1 to 32 (1-00 to 2-15)
	# ID 2 activate 33 to 64 (3-00 to 4-15)
	def bitmap_to_array(bitmap)
		bitmap[2..3] = [0,0] if(id == 1)
		bitmap[0..1] = [0,0] if(id == 2)

		id_list = []
		0.upto 3 do |u|
			next if(bitmap[u] == 0)
			0.upto 15 do |l|
				if(((bitmap[u] >> l) & 1) == 1)
					id_list << (u*16+l+1)
				end
			end
		end
		id_list
	end
end
