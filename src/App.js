import './App.css';

import React from 'react';
import Modal from 'react-modal';
import Webcam from "react-webcam";

import "react-toggle/style.css";
import Toggle from 'react-toggle';

//import bg from './img/MirrorMirror.png';
import bgSimple from './img/mirror_simple.png';


import textVideo from './img/mirror.mp4';
import angelInVideo from './img/angelcmt_in.mp4';
import angelLoopVideo from './img/angelcmt_loop.mp4';
import angelOutVideo from './img/angelcmt_out.mp4';
import devilInVideo from './img/devilcmt_in.mp4';
import devilLoopVideo from './img/devilcmt_loop.mp4';
import devilOutVideo from './img/devilcmt_out.mp4';

import { FaGear, FaXmark } from "react-icons/fa6";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.webcamRef = React.createRef();

        this.state = {
            imageSrc: null,
            darkTheme: false,
            //bgSimple: true,
            text: "",
            textOpacity: 0,
            errorMessage: "Look who's trying to steal the spotlight with that fashionable style! It's like you're single-handedly trying to bring the grace to this whole event.",
            textVideoOpacity: 0,
            angelInVideoOpacity: 0,
            angelLoopVideoOpacity: 0,
            angelOutVideoOpacity: 0,
            devilInVideoOpacity: 0,
            devilLoopVideoOpacity: 0,
            devilOutVideoOpacity: 0,
            modalIsOpen: false,
            btnToCallFirstModel: "Enter",
            btnToCallSecondModel: " ",
            pauseActionUntil: 0,
            pauseTime: 10000, //time to pause when action is triggered in ms
            fetchTimeout: 10000, // >= animation delay
            animationId: 0,
            clearTextWait: 15000,
            timeToClearText: 0,
            //backupDevilModel: false,
            defaultCamera: "3db02f7ea75473109c60f7c5c814aae49454f437d8f93536821c74a637d73134",
        };
    }

    bindActions() {
        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case this.state.btnToCallFirstModel:
                    this.triggerAction(0);
                    break;
                case this.state.btnToCallSecondModel:
                    this.triggerAction(1);
                    break;
                default:
                    break
            }
        });
    }

    initAnimation() {
        let videoIn = ["angelInVideo", "devilInVideo"];
        let videoLoop = ["angelLoopVideo", "devilLoopVideo"];
        let videoOut = ["angelOutVideo", "devilOutVideo"];

        let removeVideo = () => {
            this._removeAnimation(videoOut[this.state.animationId]);
            this._graduallyChangeTextOpacity(1000, 50, 0, 0.9);
            this.setState({
                timeToClearText: new Date().getTime() + this.state.clearTextWait
            });
        }

        let showVideoOut = () => {
            this._removeAnimation(videoLoop[this.state.animationId]);
            this._startAnimation(videoOut[this.state.animationId], 1);
            this._graduallyChangeAnimationOpacity(videoOut[this.state.animationId], 1000, 50, 1, 0);
        }

        let showVideoLoop = () => {
            this._removeAnimation(videoIn[this.state.animationId]);
            this._startAnimation(videoLoop[this.state.animationId], 1);
        }

        let showVideoIn = () => {
            this._removeAnimation("textVideo");
            this._startAnimation(videoIn[this.state.animationId], 0.9);
            this._graduallyChangeAnimationOpacity(videoIn[this.state.animationId], 1000, 50, 0.9, 1);
        }

        document.getElementById('textVideo').addEventListener('ended', showVideoIn, false);
        document.getElementById('angelInVideo').addEventListener('ended', showVideoLoop, false);
        document.getElementById('devilInVideo').addEventListener('ended', showVideoLoop, false);
        document.getElementById('angelLoopVideo').addEventListener('ended', () => {
            if (!this.state.text) {
                showVideoLoop();
            } else {
                showVideoOut();
            }
        }, false);
        document.getElementById('devilLoopVideo').addEventListener('ended', () => {
            if (!this.state.text) {
                showVideoLoop();
            } else {
                showVideoOut();
            }
        }, false);
        document.getElementById('angelOutVideo').addEventListener('ended', removeVideo, false);
        document.getElementById('devilOutVideo').addEventListener('ended', removeVideo, false);
    }

    componentDidMount() {
        this.bindActions();
        this.initAnimation();

        setInterval(() => {
            if (this.state.textOpacity > 0.1 && new Date().getTime() > this.state.timeToClearText) {
                this._graduallyChangeTextOpacity(1000, 50, 1, 0);
            }
        }, 5000);

        // const handleDevices = React.useCallback(mediaDevices => {
        //     this.setState((prevState) => {
        //         prevState.cameras.push(mediaDevices);
        //         console.log(prevState.cameras);
        //         return prevState;
        //     });
        // });

        // navigator.mediaDevices.enumerateDevices().then(handleDevices);
    }

    takeScreenshot() {
        let imageSrc = this.webcamRef.current.getScreenshot();
        this.setState({imageSrc: imageSrc});
        console.info("image taken");
    }

    triggerAction(id) {
        let currentTime = new Date().getTime();
        if (currentTime < this.state.pauseActionUntil) {
            console.info("Canceled action, still pausing");
            return;
        }

        this.setState({
            pauseActionUntil: currentTime + this.state.pauseTime
        })
        
        this._displayAnimation(id);
        setTimeout(() => {
            this.takeScreenshot();
        }, 500)
        setTimeout(() => {
            this.callApi(id);
        }, 1000)
        //setTimeout(()=> this.callApi(id), 1000);
    }

    _fetchTimeout = (url, ms, { signal, ...options } = {}) => {
        const controller = new AbortController();
        const promise = fetch(url, { signal: controller.signal, ...options });
        if (signal) signal.addEventListener("abort", () => controller.abort());
        const timeout = setTimeout(() => controller.abort(), ms);
        return promise.finally(() => clearTimeout(timeout));
    };

    _displayOutput(output) {
        this.setState({
            text: output,
        })
    }

    _startAnimation(video, opacity) {
        let ref = "vidRef-" + video;
        this.refs[ref].play();
        let newState = {};
        newState[video + "Opacity"] = opacity;
        this.setState(newState);
    }

    _removeAnimation(video) {
        let newState = {};
        newState[video + "Opacity"] = 0;
        this.setState(newState);
    }

    _graduallyChangeAnimationOpacity(video, duration, loop, startOpacity, endOpacity) {
        let loopCount = 0;
        let _this = this;

        var looper = setInterval(function(){ 
            loopCount++;
            if (loopCount === loop)
            {
                let newState = {};
                newState[video + "Opacity"] = endOpacity;
                _this.setState(newState);
                clearInterval(looper);
            } else {
                let newState = {};
                newState[video + "Opacity"] = startOpacity + loopCount * (endOpacity - startOpacity) / loop;
                _this.setState(newState);
            }
        }, duration / loop);
    }

    _graduallyChangeTextOpacity(duration, loop, startOpacity, endOpacity) {
        let loopCount = 0;
        let _this = this;

        var looper = setInterval(function(){ 
            loopCount++;
            if (loopCount === loop)
            {
                _this.setState({textOpacity: endOpacity});
                clearInterval(looper);
            } else {
                _this.setState({textOpacity: startOpacity + loopCount * (endOpacity - startOpacity) / loop});
            }
        }, duration / loop);
    }

    _hideText() {
        this.setState({text: null, textOpacity: 0});
    }

    _displayAnimation(id) {
        console.info("animation started");

        this.setState({animationId: id});

        this._hideText();
        this._startAnimation("textVideo", 0);
        this._graduallyChangeAnimationOpacity("textVideo", 1000, 50, 0.1, 0.9);
    }

    async callApi(modalId) {
        let modalUrls = [
            "https://3wzkaj4pi7.execute-api.us-west-2.amazonaws.com/prod/angel/",
            "https://3wzkaj4pi7.execute-api.us-west-2.amazonaws.com/prod/devil/"
        ];
        //console.log(this.state.backupDevilModel);
        let url = modalUrls[modalId];
        console.info(url);

        const controller = new AbortController();

        const { signal } = controller;

        try {
            if (modalId === 0) {
                let options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ image_base64: this.state.imageSrc.split(",")[1] }),
                }

                const response = await this._fetchTimeout(url, this.state.fetchTimeout, { signal, ...options });
                const json = await response.json();

                // const response = await fetch(url, {
                //     method: "POST",
                //     headers: {
                //         "Content-Type": "application/json",
                //     },
                //     body: JSON.stringify({ image: this.state.imageSrc.split(",")[1] }),
                // });
                  
                // parse response update ui
                // const json = await response.json();
                this.setState({text: json["result"], timeToClearText: 9999999999999});
            } else {
                let options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ image_base64: this.state.imageSrc.split(",")[1] }),
                };

                const response = await this._fetchTimeout(url, this.state.fetchTimeout, { signal, ...options });
                const json = await response.json();

                // const response = await fetch(url, {
                //     method: "POST",
                //     headers: {
                //         "Content-Type": "application/json",
                //     },
                //     body: JSON.stringify({ image_base64: this.state.imageSrc.split(",")[1] }),
                // });
                
                // // parse response update ui
                // const json = await response.json();
                this.setState({text: json["result"], timeToClearText: 9999999999999});
            }

        } catch (error) {
            // console.info(error);
            if (error.name === "AbortError") {
                console.log("AbortError: " +  error)
                // fetch aborted either due to timeout or
                // due to user clicking the cancel button
            } else {
                console.log("OtherError: " + error)
                // network error or json parsing error
            }
            this.setState({text: this.state.errorMessage, timeToClearText: 9999999999999});
        }
    }

    render() {
        let screenWidth = window.innerWidth;
        let screenHeight = window.innerHeight;

        return (
            <div className={"App " + (this.state.darkTheme ? "theme-dark" : "theme-light")}>
                {/* Webcam */}
                <Webcam className='webcam' ref={this.webcamRef} mirrored 
                    width={screenWidth} height={screenHeight}
                    videoConstraints={
                        {
                            facingMode: 'user', 
                            deviceId: this.state.defaultCamera,
                            aspectRatio: screenWidth/screenHeight}
                    }
                />

                {/* Main Content,  */}
                <div className='content'> 
                    <div className='text' style={{opacity: this.state.textOpacity}}>
                        <div className='text-container'>
                            <p>{this.state.text}</p>
                        </div>
                    </div>
                </div>


                {/* Background Image */}
                <video className='bg-video' rel="prefetch" style={{opacity: this.state.textVideoOpacity}} id="textVideo" ref="vidRef-textVideo"> 
                    <source src={textVideo} type="video/mp4"/>
                </video>
                <video className='bg-video' rel="prefetch" style={{opacity: this.state.angelInVideoOpacity}} id="angelInVideo" ref="vidRef-angelInVideo"> 
                    <source src={angelInVideo} type="video/mp4"/>
                </video>
                <video className='bg-video' rel="prefetch" style={{opacity: this.state.angelLoopVideoOpacity}} id="angelLoopVideo" ref="vidRef-angelLoopVideo"> 
                    <source src={angelLoopVideo} type="video/mp4"/>
                </video>
                <video className='bg-video' rel="prefetch" style={{opacity: this.state.angelOutVideoOpacity}} id="angelOutVideo" ref="vidRef-angelOutVideo"> 
                    <source src={angelOutVideo} type="video/mp4"/>
                </video>
                <video className='bg-video' rel="prefetch" style={{opacity: this.state.devilInVideoOpacity}} id="devilInVideo" ref="vidRef-devilInVideo"> 
                    <source src={devilInVideo} type="video/mp4"/>
                </video>
                <video className='bg-video' rel="prefetch" style={{opacity: this.state.devilLoopVideoOpacity}} id="devilLoopVideo" ref="vidRef-devilLoopVideo"> 
                    <source src={devilLoopVideo} type="video/mp4"/>
                </video>
                <video className='bg-video' rel="prefetch" style={{opacity: this.state.devilOutVideoOpacity}} id="devilOutVideo" ref="vidRef-devilOutVideo"> 
                    <source src={devilOutVideo} type="video/mp4"/>
                </video>
                <img src={bgSimple} alt='bg' className='bg-img'/>

                {/* Setting Modal */}
                <div className='controls'>
                    <button className='open-modal-btn' onClick={() => {
                        this.setState({
                            modalIsOpen: true
                        })
                    }}>
                        <FaGear />
                    </button>
                </div>

                <Modal
                    ariaHideApp={false}
                    isOpen={this.state.modalIsOpen}
                >
                    <h2>
                        Settings
                        <button className='modal-close-btn' onClick={() => {
                            this.setState({
                                modalIsOpen: false
                            })
                        }}>
                            <FaXmark />
                        </button>
                    </h2>
                    
                    {/*<div className='modal-subtitle'>
                        Dark Theme:
                        <Toggle
                            className='dark-theme-toggle'
                            defaultChecked={this.state.darkTheme}
                            icons={false}
                            onChange={() => this.setState({darkTheme: !this.state.darkTheme})} 
                        />
                    </div>
                    <div className='modal-subtitle'>
                        Simple Background:
                        <Toggle
                            className='dark-theme-toggle'
                            defaultChecked={this.state.bgSimple}
                            icons={false}
                            onChange={() => this.setState({bgSimple: !this.state.bgSimple})} 
                        />
                    </div>
                    <div className='modal-subtitle'>
                        Use backup devil model:
                        <Toggle
                            className='dark-theme-toggle'
                            defaultChecked={this.state.backupDevilModel}
                            icons={false}
                            onChange={() => this.setState({backupDevilModel: !this.state.backupDevilModel})} 
                        />
                    </div> */}
                    <div className='modal-subtitle'>
                        Camera:
                        <CameraList handler={(cameraId) => {this.setState({defaultCamera: cameraId})}} />
                    </div>
                    <div className='modal-subtitle'>Last Screenshot:</div>
                    {!this.state.imageSrc ? "Not yet taken" : <img id='img' className='screenshot-display' alt='screenshot' src={this.state.imageSrc}/>}
                </Modal>
            </div>
        );
    }
}

const CameraList = (props) => {
    // const [deviceId, setDeviceId] = React.useState({});
    const [devices, setDevices] = React.useState([]);
  
    const handleDevices = React.useCallback(
      mediaDevices =>
        setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
      [setDevices]
    );
  
    React.useEffect(
      () => {
        navigator.mediaDevices.enumerateDevices().then(handleDevices);
      },
      [handleDevices]
    );
  
    return (
      <select id="camera-select" onChange={() => {props.handler(document.getElementById('camera-select').value)}}>
        {devices.map((device, key) => (
            // <div>
            //   {/* <Webcam audio={false} videoConstraints={{ deviceId: device.deviceId }} /> */}
            //   {/* {device.label || `Device ${key + 1}`} */}
            //   {device.deviceId}
            // </div>
            <option value={device.deviceId}>{device.label || `Device ${key + 1}`}</option>
          ))}
      </select>
    );
  };

export default App;
