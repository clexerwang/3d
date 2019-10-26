/*
* 加载xml：
* 1、通过ajax获取xml，
* 2、IE中，使用ActiveXObject的loadXML方法将字符串转为xml读取。使用load方法加载本地xml文件。
* 3、其他浏览器中，使用document.implementation.createDocument来创建一个document对象，再使用它的load方法加载本地xml文件
*    使用
*
*
*  1、读取服务器中的xml文件：直接使用xhr.responseXML属性获取。
*  2、读取本地xml文件：
*     IE：使用ActiveXObject实例的load方法读取文件内容。
*     其他：推荐使用ajax读取本地xml文件
*  3、在读取了文件内容后，需要对内容进行解析才能获取到xml中的dom对象：
*     IE：使用ActiveXObject实例的loadXML方法，对读取到的内容解析。
*     其他：使用DOMParser实例的parseFromString方法对内容进行解析。
* */




//xml解析
export function xmlParse(xmlData){
    let data;
    let xmlDoc;
    //检测浏览器版本
    if(window.ActiveXObject!==undefined){//ie
        try{
            xmlDoc= new ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = false;
            data = xmlDoc.load(xmlData);
        }catch(error){
            throw new Error(error);
        }
    }else{
        try{
            xmlDoc = new DOMParser();
            data = xmlDoc.parseFromString(xmlData,'text/xml');

            // 如果读取本地文件，就不需要下面这个语句
            /*if(data.firstChild.textContent){
                xmlDoc = new DOMParser();
                data = xmlDoc.parseFromString(data.firstChild.textContent,'text/xml');
            }*/
        }catch(error){
            throw new Error(error);
        }
    }
    return data;
}

export function readXMLFile(file){
    let xhr = new XMLHttpRequest();
    xhr.open('get',file,false);
    xhr.send(null);
    return xmlParse(xhr.responseText)
}




export function xmlToJSON(xmlDom){
    let obj = {
        name:xmlDom.nodeName
    };
    addAttr(xmlDom.attributes,obj);
    if(xmlDom.children.length){
        obj.children = [];
        for(let i=0;i<xmlDom.children.length;i++){
            obj.children.push(xmlToJSON(xmlDom.children[i]));
        }
    }
    return obj;
}

function addAttr(attributes,obj){
    for(let i =0;i<attributes.length;i++){
        obj[attributes[i].name] = attributes[i].value;
    }
    return obj;
}



