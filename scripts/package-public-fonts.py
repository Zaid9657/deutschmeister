# Package installed OFL fonts as WOFF, retaining Western/European cmap and glyphs.
# Unused glyph slots remain empty; indices stay stable for composites/kerning.
from pathlib import Path
import struct,zlib
out=Path('public/fonts')
for p in out.glob('*'): p.unlink()
for family in ['Caladea','Carlito']:
 for style in ['Regular','Bold']:
  src=Path(f'/usr/share/fonts/truetype/crosextra/{family}-{style}.ttf').read_bytes()
  num=struct.unpack_from('>H',src,4)[0]; tables={}
  for i in range(num):
   tag,check,offset,length=struct.unpack_from('>4sIII',src,12+16*i);tables[tag]=src[offset:offset+length]
  cmap=tables[b'cmap']; keep={0}
  for i in range(struct.unpack_from('>H',cmap,2)[0]):
   _,_,off=struct.unpack_from('>HHI',cmap,4+8*i)
   if struct.unpack_from('>H',cmap,off)[0]!=4: continue
   segs=struct.unpack_from('>H',cmap,off+6)[0]//2
   for s in range(segs):
    end=struct.unpack_from('>H',cmap,off+14+2*s)[0]; start=struct.unpack_from('>H',cmap,off+16+2*segs+2*s)[0]
    delta=struct.unpack_from('>h',cmap,off+16+4*segs+2*s)[0]; rpos=off+16+6*segs+2*s; ran=struct.unpack_from('>H',cmap,rpos)[0]
    for c in range(start,min(end+1,0x2200)):
     if c>0x024f and not 0x2000<=c<=0x219f:continue
     g=(c+delta)&65535 if not ran else struct.unpack_from('>H',cmap,rpos+ran+2*(c-start))[0]
     if ran and g:g=(g+delta)&65535
     keep.add(g)
  n=struct.unpack_from('>H',tables[b'maxp'],4)[0]; long=struct.unpack_from('>h',tables[b'head'],50)[0]
  loc=list(struct.unpack('>'+('I' if long else 'H')*(n+1),tables[b'loca']))
  if not long:loc=[x*2 for x in loc]
  todo=list(keep)
  while todo:
   g=todo.pop(); data=tables[b'glyf'][loc[g]:loc[g+1]]
   if not data or struct.unpack_from('>h',data)[0]>=0:continue
   p=10
   while True:
    flags,sub=struct.unpack_from('>HH',data,p);p+=4
    if sub not in keep:keep.add(sub);todo.append(sub)
    p+=4 if flags&1 else 2
    p+=2 if flags&8 else 4 if flags&64 else 8 if flags&128 else 0
    if not flags&32:break
  glyf=bytearray();newloc=[]
  for g in range(n):
   newloc.append(len(glyf))
   if g in keep:
    data=bytearray(tables[b'glyf'][loc[g]:loc[g+1]])
    if len(data)>=10:
     contours=struct.unpack_from('>h',data)[0]
     if contours>=0:
      at=10+2*contours
      count=struct.unpack_from('>H',data,at)[0]
      data[at:at+2+count]=b'\0\0'
     else:
      at=10
      while True:
       pos=at;flags,sub=struct.unpack_from('>HH',data,at);at+=4
       at+=4 if flags&1 else 2
       at+=2 if flags&8 else 4 if flags&64 else 8 if flags&128 else 0
       if not flags&32:break
      if flags&256:
       struct.pack_into('>H',data,pos,flags&~256)
       data=data[:at]
    glyf+=data
   while len(glyf)%4:glyf.append(0)
  newloc.append(len(glyf));tables[b'glyf']=bytes(glyf);tables[b'loca']=struct.pack('>'+'I'*(n+1),*newloc)
  head=bytearray(tables[b'head']);struct.pack_into('>h',head,50,1);struct.pack_into('>I',head,8,0);tables[b'head']=bytes(head)
  # Modified OFL subsets use their own family names (Carlito is reserved).
  familyName = 'Meister Serif' if family == 'Caladea' else 'Meister Sans'
  name=tables[b'name'];format,count,base=struct.unpack_from('>HHH',name)
  assert format == 0
  records=[];strings=bytearray()
  for i in range(count):
   platform,encoding,language,ident,length,at=struct.unpack_from('>HHHHHH',name,6+12*i)
   raw=name[base+at:base+at+length]
   codec='utf-16-be' if platform in (0,3) else 'mac_roman'
   if ident in (1,3,4,6,16,18,21,25):
    text=raw.decode(codec).replace(family, familyName)
    if ident in (6,25):text=text.replace(' ','')
    raw=text.encode(codec)
   records.append(struct.pack('>HHHHHH',platform,encoding,language,ident,len(raw),len(strings)));strings+=raw
  tables[b'name']=struct.pack('>HHH',0,count,6+12*count)+b''.join(records)+strings
  # WOFF consumers reconstruct SFNT checksums from directory entries.
  
  for tag in [b'GSUB',b'GPOS',b'GDEF',b'DSIG',b'fpgm',b'prep',b'cvt ',b'gasp',b'hdmx',b'LTSH']:tables.pop(tag,None)
  def sum32(data):
   data=data+b'\0'*((-len(data))%4)
   return sum(struct.unpack('>'+'I'*(len(data)//4),data))&0xffffffff
  # Correct OpenType whole-font checksum after subsetting/renaming. The head
  # directory checksum itself is always computed with this field zeroed.
  nt=len(tables);power=2**(nt.bit_length()-1);at=12+16*nt
  sfntHeader=struct.pack('>IHHHH',0x00010000,nt,power*16,nt.bit_length()-1,nt*16-power*16)
  sfntDir=bytearray();sfntData=bytearray()
  for tag,data in sorted(tables.items()):
   sfntDir+=struct.pack('>4sIII',tag,sum32(data),at+len(sfntData),len(data))
   sfntData+=data+b'\0'*((-len(data))%4)
  head=bytearray(tables[b'head']);struct.pack_into('>I',head,8,(0xB1B0AFBA-sum32(sfntHeader+sfntDir+sfntData))&0xffffffff);tables[b'head']=bytes(head)
  entries=[];payload=bytearray(); offset=44+20*len(tables)
  for tag,data in sorted(tables.items()):
   checkData=data if tag!=b'head' else data[:8]+b'\0\0\0\0'+data[12:]
   checksum=sum32(checkData)
   packed=zlib.compress(data,9);packed=packed if len(packed)<len(data) else data
   entries.append(struct.pack('>4sIIII',tag,offset+len(payload),len(packed),len(data),checksum));payload+=packed
   payload+=b'\0'*((-len(payload))%4)
  length=offset+len(payload); sfnt=12+16*len(tables)+sum((len(d)+3)//4*4 for d in tables.values())
  header=struct.pack('>4sIIHHIHHIIIII',b'wOFF',0x00010000,length,len(tables),0,sfnt,1,0,0,0,0,0,0)
  file=out/f'{familyName.lower().replace(" ", "-")}-v1-{style.lower()}.woff';file.write_bytes(header+b''.join(entries)+payload)
  print(file,len(file.read_bytes()),'glyphs',len(keep))
lic=Path('docs/reviews/codex-design-gap-2026-11-08/font-licenses.txt')
lic.write_text('Self-hosted Caladea and Carlito, sourced from the installed Debian fonts-crosextra packages. Modified European WOFF subsets are renamed Meister Serif (Caladea) and Meister Sans (Carlito) to respect the reserved family name. Original copyright and OFL notices are retained in their name tables.\n\n'+Path('/usr/share/doc/fonts-crosextra-caladea/copyright').read_text()+'\n\n'+Path('/usr/share/doc/fonts-crosextra-carlito/copyright').read_text())
