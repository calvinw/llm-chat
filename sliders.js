stack(
  s("bd*2 ~ sd ~").bank("RolandTR808")
    .gain(0.8)
    .speed(1)
    .room(0.2),
  
  note("c3 eb3 g3 bb3").s("sawtooth")
    .slow(4)
    .gain(0.5)
    .lpf(1200)
    .attack(0.1)
    .release(0.3),
  
  note("c5 d5 eb5 f5 g5").s("triangle")
    .fast(2)
    .gain(0.3)
    .delay(0.25)
    .pan(0.5),
  
  s("hh*4").bank("RolandTR909")
    .gain(0.25)
    .hpf(8000)
    .crush(8)
)
