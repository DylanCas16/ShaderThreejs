precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
#define F(d)smoothstep(e,-e,d)
void main(){vec2 r=u_resolution,p=(gl_FragCoord.xy-r/2.)/r.y,a=vec2(0,.2);float t=mod(u_time*.4,6.2832),e=1./r.y,c=cos(t),s=sin(t),l=length(p),v,A,B;p*=mat2(c,-s,s,c);A=length(p-a);B=length(p+a);v=F(-p.x);v=mix(v,1.,F(A-.2));v=mix(v,0.,F(B-.2));v=mix(v,0.,F(A-.05));v=mix(v,1.,F(B-.05));gl_FragColor=vec4(mix((.5+.5*cos(t+vec3(0,2,4)))*exp(-max(l-.4,0.)*6.)*(.8+.2*sin(l*20.-t*4.)),vec3(v),F(l-.4)),1);}