#coding: utf-8
require_relative 'Pi'

# add point information as below in point_list.json
# ["PiDummy",{"type":"Pi","subtype":{"manufacturer":"","type":"","model":""},"usage":"electricity","id":"dmy001-00001","pid":1,"dev_id":"dmy001","name":"Power","icon":"PI.png","attr":{"ppd":false,"parent":null,"hide":false,"notuse":false,"battery":false,"unit_label":"kWh"}}]

class PiDummy < Pi
	def initialize(pid,dev_id)
		super
		@data_man = nil
		@com_stat = true
		@meter = @last_val
	end

	def set_data_man(data_man)
		@data_man = data_man
		@meter = @last_val
		@meter = 0 if(@meter == nil)
		Thread.new do
			loop {
				if(@pid == 1)
					t = rand(180..300)
				elsif(@pid == 4)
					t = rand(400..500)
				else 
					t = rand(300..400)
				end

				sleep t
				val = @meter+1
				@data_man.cos(@pid,@dev_id,{'meter'=>val})
			}			
		end
	end
end
