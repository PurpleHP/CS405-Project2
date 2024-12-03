/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */


		// Lighting-related uniform locations
		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.lightColorLoc = gl.getUniformLocation(this.prog, 'color');
		this.ambientLightLoc = gl.getUniformLocation(this.prog, 'ambient');

		// Normal buffer for lighting
		this.normalbuffer = gl.createBuffer();

		// Default lighting settings
		this.isLightingEnabled = false;
		this.ambientLightValue = 0.2;
		this.lightColor = [1.0, 1.0, 1.0]; // White light
		this.lightDirection = [0, 0, 1]; // Default light direction		

		/**
		 * @Task3 : Specular lighting
		 */        

		this.viewPosLoc = gl.getUniformLocation(this.prog, 'viewPos');
        this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');

		this.viewPos = [0, 0, 1];  // Default camera position
        this.shininess = 32.0;  // Default specular exponent

        /**
		 * @Task4 : Double texture blending
		 */     
        this.texture1 = null;
        this.texture2 = null;
		     
	
	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */

		 // Normal coordinates buffer (new for lighting)
		 gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
		 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);


 
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */

		// Normal coordinates (new for lighting)
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
		const normalLoc = gl.getAttribLocation(this.prog, 'normal');
		gl.enableVertexAttribArray(normalLoc);
		gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);


		// Update light-related uniforms
		gl.uniform1i(this.enableLightingLoc, this.isLightingEnabled);
		gl.uniform3fv(this.lightColorLoc, this.lightColor);
		gl.uniform3f(this.lightPosLoc, lightX, lightY, 1);

		gl.uniform1f(this.ambientLightLoc, this.ambientLightValue);
			

		/**
		 * @Task3 : Specular lighting
		 */
		// Update specular light uniforms
        gl.uniform3fv(this.viewPosLoc, this.viewPos);
        gl.uniform1f(this.shininessLoc, this.shininess);

        /**
		 * @Task4 : Blend two textures
		 */

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture2);

		///////////////////////////////


		updateLightPos();
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);


	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img, index) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
    
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            img
        );
    
        // Texture parameter handling
        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            /**
			 * @Task1 : You should implement this part to accept non power of 2 sized textures
			 */
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    
        gl.useProgram(this.prog);
    
        /**
		 * @Task4 : Blend two textures
		 */
        if (index === 0) {
            this.texture1 = texture;
        } else if (index === 1) {
            this.texture2 = texture;
        }
        gl.useProgram(this.prog);
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const sampler = gl.getUniformLocation(this.prog, index === 0 ? 'tex1' : 'tex2');
        gl.uniform1i(sampler, index);
    }

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		gl.useProgram(this.prog);
		this.isLightingEnabled = show;
		gl.uniform1i(this.enableLightingLoc, show);
	}
	
	setAmbientLight(ambient) {
		console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		this.ambientLightValue = ambient;
        gl.useProgram(this.prog);
        gl.uniform1f(this.ambientLightLoc, ambient);
	}

	/**
	 * @Task3 : Specular lighting
	 */
	setSpecularLight(element) {
        this.viewPos = [0,0,1];
		this.shininess = element;
        gl.useProgram(this.prog);
        gl.uniform3fv(this.viewPosLoc, this.viewPos);
        gl.uniform1f(this.shininessLoc, element);
    }

}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
                v_normal = mat3(mvp) * normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
const meshFS = `
			precision mediump float;

			uniform bool showTex;
			uniform bool enableLighting;
			uniform sampler2D tex1;
			uniform sampler2D tex2;

			//diffuse ligting
			uniform vec3 color; 
			uniform vec3 lightPos;

			//ambient lighting
			uniform float ambient;

			//specular lighting
			uniform vec3 viewPos;  // Camera/view position
    		uniform float shininess;  // Specular exponent


			varying vec2 v_texCoord;
			varying vec3 v_normal;

			void main()
			{
				if(showTex && enableLighting){
					// UPDATE THIS PART TO HANDLE LIGHTING
					// Normalize normal
					vec3 normal = normalize(v_normal);
					vec3 lightDir = normalize(lightPos);
					vec3 viewDir = normalize(viewPos);
					
					// Diffuse lighting
					float diffuseIntensity = max(dot(normal, lightDir), 0.0);
					vec3 diffuse = diffuseIntensity * color;

					// Ambient lighting
					vec3 ambient = ambient * color;
					
					// Specular lighting
					vec3 reflectDir = reflect(-lightDir, normal);
					float specularIntensity = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
					vec3 specular = specularIntensity * color;
					
                    // Blend two textures
                    vec4 texture1Color = texture2D(tex1, v_texCoord);
                    vec4 texture2Color = texture2D(tex2, v_texCoord);
                    vec4 blendedTexture = mix(texture1Color, texture2Color, 0.5);
             
                    // Combine ambient, diffuse, and specular lighting
                    vec3 finalColor = (ambient + diffuseIntensity + specularIntensity) * blendedTexture.rgb * color;
                    
                    gl_FragColor = vec4(finalColor, blendedTexture.a);
				}
				else if(showTex){
                    vec4 texture1Color = texture2D(tex1, v_texCoord);
                    vec4 texture2Color = texture2D(tex2, v_texCoord);
                    vec4 blendedTexture = mix(texture1Color, texture2Color, 0.5);
                    
                    gl_FragColor = blendedTexture;

				}
				else{
					gl_FragColor =  vec4(1.0, 0, 0, 1.0);
				}
			}`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////
