#coding: utf-8

require_relative 'SmartPi'

class SmartPiMb < SmartPi
	def initialize(pid,dev_id)
		super
		@power_unit_label = 'kW'
		@energy_addr = 0
		@power_addr = 0 

		@type = 'kW'
	end

	def read_data(slave)
		meter = 0
		power = 0
		meter = slave.input_registers[energy_addr] if(energy_addr != nil)
		power = slave.input_registers[power_addr] if(power_addr != nil)
		@ready = true
		# has to convert value to float
		# [29760, 41669] ==> to float
#		meter = b_to_f(byte_orderA(meter))
#		power = b_to_f(byte_orderA(power))
		return {'com_stat'=>true,'meter'=>meter,'power'=>power}
	end

	def make_new_point(pid,data)
		return nil
	end

	def energy_addr
		return nil
	end
	def power_addr
		return nil
	end

# A type N/A
def byte_orderA(val)
  v = break_byte(val)
  [v[0]].pack("C").unpack("B*")[0]+[v[1]].pack("C").unpack("B*")[0]+[v[2]].pack("C")[0].unpack("B*")[0]+[v[3]].pack("C").unpack("B*")[0]
end

# B type byte word swap
def byte_orderB(val)
  v = break_byte(val)
  [v[3]].pack("C").unpack("B*")[0]+[v[2]].pack("C").unpack("B*")[0]+[v[1]].pack("C")[0].unpack("B*")[0]+[v[0]].pack("C").unpack("B*")[0]
end

# C type byte swap
def byte_orderC(val)
  v = break_byte(val)
  [v[1]].pack("C").unpack("B*")[0]+[v[0]].pack("C").unpack("B*")[0]+[v[3]].pack("C")[0].unpack("B*")[0]+[v[2]].pack("C").unpack("B*")[0]
end

# D type word swap
def byte_orderD(val)
  v = break_byte(val)
  [v[2]].pack("C").unpack("B*")[0]+[v[3]].pack("C").unpack("B*")[0]+[v[0]].pack("C")[0].unpack("B*")[0]+[v[1]].pack("C").unpack("B*")[0]
end

	def break_byte(val) # val is [a,b]
	  v = [0,0,0,0]
	  v[0] = val[0] >> 8
	  v[1] = val[0] & 0xff
	  v[2] = val[1] >> 8
	  v[3] = val[1] & 0xff
	  return v
	end

	def b_to_f(val)	# val is bit string(32bit) of float value
		s = val[0,1]
		e = val[1,8]
		f = val[9,23]

    sgn = s == "0" ? +1.0 : -1.0
    exp = Integer("0b" + e)
    fra = Integer("0b" + f)
    if exp == 0
      if fra == 0
        sgn * 0                     # ±0 (positive/negative zero)
      else
        sgn * fra * 2**(-126-23)    # 非正規化数 (denormalized number)
      end
    elsif exp == 255
      if fra == 0
        sgn * Inf                   # ±∞ (positive/negative infinity)
      else
        NaN                         # 非数 (not a number)
      end
    else
      fra += 1 << 23                # ゲタ
      sgn * fra * 2**(exp-127-23)   # 正規化数 (normalized number)
    end
  end
end
