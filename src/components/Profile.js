
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";

import NFTTile from "./NFTTile";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";
import { useLocation, useParams, Link } from 'react-router-dom';
import {  useState, useContext } from 'react';
import Marketplace from "../Marketplace.json";
import React from 'react';
import { storage, db, } from '../firebase'
import { v4 } from "uuid";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  list,
} from "firebase/storage";
import { collection, addDoc, getDocs,getDoc, serverTimestamp, updateDoc, doc, arrayUnion, query, 
  where, onSnapshot, increment,snapshotEqual, writeBatch} from 'firebase/firestore';
import { useEffect } from "react";
import VerifyCard from "./VerifyCard";
import '../style1.css'
import ReqCard from "./ReqCard";
import { LoginContext } from './LoginContext'
import firebase from "firebase/compat/app"
import 'firebase/compat/firestore';
import {useAuth} from '../firebase'
import { Avatar, Button, Flex, FormControl, FormLabel, Heading, Input, Text } from "@chakra-ui/react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure
  } from '@chakra-ui/react'
import {  AvatarBadge, AvatarGroup } from '@chakra-ui/react'
export default function Profile () {
    const { isOpen, onOpen, onClose } = useDisclosure()
const { data, setData } = useContext(LoginContext);
    const currentUser = useAuth();
    const [thedata, updateData] = useState([]);
    const [dataFetched, updateFetched] = useState(false);
    const [address, updateAddress] = useState("0x");
    const [totalPrice, updateTotalPrice] = useState("0");

    const [userName, setUserName] = useState('')
    const [about, setAbout] = useState('')
    const [imgurl, setImgUrl] = useState('')

    const [ name, setName ] = useState('');
    const [ img, setImg ] = useState(null);
    let docuRef=''
    
    {currentUser?.uid? docuRef = doc(db, 'Accounts',currentUser.uid):<></>}

    let { id } = useParams();

    let docRef = doc(db, 'Accounts',id)

    useEffect(()=>{
        onSnapshot(docRef, (doc) =>{
            setUserName(doc.data().name)   
            setAbout(doc.data().about)
            setImgUrl(doc.data().profileImgUrl)
    })},[])


    async function getNFTData(tokenId) {
        const ethers = require("ethers");
        let sumPrice = 0;
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)

        //create an NFT Token
        let transaction = await contract.getMyNFTs()

        /*
        * Below function takes the metadata from tokenURI and the data returned by getMyNFTs() contract function
        * and creates an object of information that is to be displayed
        */
        
        const items = await Promise.all(transaction.map(async i => {
            const tokenURI = await contract.tokenURI(i.tokenId);
            
            let meta = await axios.get(tokenURI);
            meta = meta.data;

            let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
            }
            sumPrice += Number(price);
            return item;
        }))

        updateData(items);
        updateFetched(true);
        updateAddress(addr);
        updateTotalPrice(sumPrice.toPrecision(3));
    }

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTData(tokenId);


    const updateValues = async() => {
        const imageRef = ref(storage, `profile images/${v4()}`);
    
        uploadBytes(imageRef, img).then(async()=>{
            const downloadURL = await getDownloadURL(imageRef)
            await updateDoc(docRef,{
            profileImgUrl: downloadURL,
            name: name,
            about: about
            })
        })
        }

    const hiddenFileInput3 = React.useRef(null);
    const handleClick3 = event => {
        hiddenFileInput3.current.click();
    };


    console.log()
    return (
        <Flex flexDir={'column'}>
            <Flex flexDir={'column'} align='center' mt={10}>
            <Avatar size='2xl' src={imgurl}></Avatar>
            <Heading style={{color:'black'}} mt='10px' mb='10px' fontSize={'23px'} fontWeight={'normal'}> {userName}</Heading>
            {currentUser?.email === data.email?<Button onClick={onOpen}>Edit Profile</Button>:null}
            <Heading style={{color:'black'}} mt='40px' fontWeight={'normal'}> About</Heading>
            <Flex borderWidth='1px' boxShadow={'md'} padding='10px' width='30%' mt='14px'><Text fontSize='18px' style={{color:'black'}} mt='10px' fontWeight={'normal'}> {about}</Text></Flex>
            </Flex>
      

            <Flex flexDir={'column'} align='center' mt={20}>
            <Heading fontWeight={'semibold'}>Your NFTs</Heading>
            <Flex flexDir='row'>
                {thedata.map((value, index) => {
                return <NFTTile data={value} key={index}></NFTTile>;
                })}
            </Flex>
        <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input onChange = {e => setName(e.target.value)} />
            </FormControl>

            <FormControl mt={4}>
              <FormLabel>About</FormLabel>
              <Input  onChange = {e => setAbout(e.target.value)} />
            </FormControl>

            <FormControl mt={4}>
                <FormLabel>Profile Image</FormLabel>
                <Button bg='blue.900' _hover={{bg:'blue.700'}}_focus={{bg:'blue.700'}}mb={2} color='white' onClick={handleClick3}>Upload Image</Button>
                <Input borderWidth='0px' style={{display:'none'}} ref={hiddenFileInput3} type='file' onChange = {(e) => {setImg(e.target.files[0])}}/>
            </FormControl> 

          </ModalBody>

          <ModalFooter>
            <Button onClick={() => {updateValues();onClose()}} colorScheme='blue' mr={3}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
            </Flex>
        </Flex>
    )
};