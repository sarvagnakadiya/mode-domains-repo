// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NameRegistry
 * @dev A contract for registering and managing names with associated NFT tokens.
 */
contract NameRegistryV2 is ERC721Enumerable, Ownable {
    using SafeMath for uint256;
    using Strings for uint256;


    uint256 public nextTokenId = 1; // ID for the next token to be minted
    uint256 public baseRegistrationPrice = 0.05 ether; // Base registration price for a name
    uint256 public registrationDuration = 365 days; // Default registration duration
    string private tld = ".mode"; // The top-level domain

    mapping(string => bool) public nameExists; // Mapping to track whether a name is registered

    mapping(uint256 => string) public tokenIdToName; // Mapping of token IDs to names
    mapping(string => uint256) public nameToTokenId; // Mapping of names to their token IDs

    mapping(uint256 => uint256) public tokenIdToCreationTimestamp; // Mapping of token IDs to creation timestamps
    mapping(uint256 => string) private tokenURIs; // Mapping of token IDs to their metadata URIs
    mapping(string => uint256) public nameExpiry; // Mapping of names to their expiry timestamps
    mapping(address => bool) public isAddressRegistered; // Mapping to check if Address registered or not

    event RegistrationPriceChanged(uint256 newPrice);
    event NameRegistered(address indexed owner, string name, uint256 expiryTimestamp);
    event NameTransferred(address indexed from, address indexed to, string name);
    event NameRenewed(address indexed owner, string name, uint256 newExpiryTimestamp);

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

    /**
     * @dev Update the base registration price.
     * @param price The new base registration price.
     * @notice This function can only be called by the contract owner.
     */
    function setBaseRegistrationPrice(uint256 price) external onlyOwner {
        baseRegistrationPrice = price;
        emit RegistrationPriceChanged(price);
    }

    /**
     * @dev Set the registration duration for names.
     * @param duration The new registration duration.
     * @notice This function can only be called by the contract owner.
     */
    function setRegistrationDuration(uint256 duration) external onlyOwner {
        registrationDuration = duration;
    }

    /**
     * @dev Get the registration price for a name.
     * @param name The name for which to get the registration price.
     * @return The registration price in wei.
     */
    function getRegistrationPrice(string memory name) public view returns (uint256) {
        uint256 nameLength = bytes(name).length;

        require(nameLength > 2, "Name must have more than 2 characters");

        uint256 price = baseRegistrationPrice;

        if (nameLength == 3) {
            price = price.mul(2); // Double the price for 3 characters
        } else if (nameLength > 3) {
            price = price.mul(3).div(2); // 1.5x the price for more than 3 characters
        }

        for (uint256 i = 0; i < nameLength; i++) {
            if (_isDigit(bytes(name)[i])) {
                price = price.div(2); // Reduce price by 2x if numerical digit found
            }
        }

        return price;
    }

    /**
     * @dev Internal function to check if a character is a digit.
     * @param _char The character to check.
     * @return true if the character is a digit, false otherwise.
     */
    function _isDigit(bytes1 _char) internal pure returns (bool) {
        return (_char >= bytes1("0") && _char <= bytes1("9"));
    }

    /**
     * @dev Register a name with a metadata URI.
     * @param name The name to be registered.
     * @param metadataURI The metadata URI for the associated NFT.
     * @notice This function requires a payment of at least the calculated registration price in wei.
     */
    function registerName(string memory name, string memory metadataURI) external payable {
        require(nameExists[name] == false, "Name is already registered");
        require(isAddressRegistered[msg.sender]==false, "Address is already registered with a name");

        uint256 currentPrice = getRegistrationPrice(name);
        require(msg.value == currentPrice, "Insufficient funds sent");

        // Mint a new NFT with the nextTokenId
        _mint(msg.sender, nextTokenId);

        // Adding data to the mappings
        nameToTokenId[name] = nextTokenId;
        nameExists[name] = true;
        tokenIdToName[nextTokenId] = name;
        tokenIdToCreationTimestamp[nextTokenId] = block.timestamp;
        tokenURIs[nextTokenId] = metadataURI;
        nameExpiry[name] = block.timestamp + registrationDuration;
        isAddressRegistered[msg.sender]= true;

        nextTokenId = nextTokenId.add(1);
        emit NameRegistered(msg.sender, name, nameExpiry[name]);
    }

    /**
     * @dev Set the metadata URI for a token.
     * @param tokenId The ID of the token.
     * @param metadataURI The new metadata URI.
     * @notice This function can only be called by the contract owner.
     */
    function setTokenURI(uint256 tokenId, string memory metadataURI) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        tokenURIs[tokenId] = metadataURI;
    }

    /**
     * @dev Get the metadata URI for a token.
     * @param tokenId The ID of the token.
     * @return The metadata URI.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return tokenURIs[tokenId];
    }

    /**
     * @dev Transfer a registered name to another address.
     * @param to The address to transfer the name to.
     * @param tokenId The ID of the token representing the name.
     */
    function transferName(address to, uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can transfer");

        string memory fullName = tokenIdToName[tokenId];
        _transfer(msg.sender, to, tokenId);

        emit NameTransferred(msg.sender, to, fullName);
    }

    /**
     * @dev Extend the registration duration of a name.
     * @param name The name to extend the duration for.
     * @param numYears The number of years to extend the duration by.
     * @notice This function requires a payment of at least the calculated extension price in wei.
     */
    function extendDuration(string memory name, uint256 numYears) external payable {
        require(nameExists[name], "Name is not registered");
        require(ownerOf(nameToTokenId[name]) == msg.sender, "Only the owner can extend duration");
        require(numYears > 0, "Extension duration must be greater than 0");


        uint256 extensionPrice = numYears.mul(getRegistrationPrice(name));
        require(msg.value == extensionPrice, "Insufficient funds sent");
        uint256 _duration = numYears.mul(registrationDuration); // no. of days
        nameExpiry[name]= nameExpiry[name].add(_duration);

        emit NameRenewed(msg.sender, name, nameExpiry[name]);
    }

    
    /**
     * @dev Resolve a name to an address.
     * @param nameWithTld The name with the top-level domain (TLD).
     * @return The resolved address.
     */
    function resolveName(string memory nameWithTld) external view returns (address) {
        require(nameExpiry[nameWithTld] > block.timestamp,"MNS expired or not found");
        require(bytes(nameWithTld).length > bytes(tld).length, "Invalid name format");


        string memory name = substring(nameWithTld, 0, bytes(nameWithTld).length - bytes(tld).length);
        uint256 tokenId = tokenIdOf(name);

        if (tokenId != 0) {
            return ownerOf(tokenId);
        }

        return address(0);
    }

    /**
     * @dev Extract a substring from a string.
     * @param str The original string.
     * @param startIndex The starting index of the substring.
     * @param endIndex The ending index of the substring.
     * @return The extracted substring.
     */
    function substring(string memory str, uint256 startIndex, uint256 endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        require(startIndex <= endIndex && endIndex <= strBytes.length, "Invalid substring range");

        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }

        return string(result);
    }

    /**
     * @dev Get the token ID associated with a name.
     * @param name The name for which to get the token ID.
     * @return The token ID.
     */
    function tokenIdOf(string memory name) public view returns (uint256) {
        return nameToTokenId[name];
    }

    /**
     * @dev Get name details by owner's address.
     * @param addr The owner's address.
     * @return nameValue The name owned by the address.
     * @return creationTimestamp The creation timestamp of the name's token.
     * @return registrationPrice The registration price of the name.
     * @return expiryTimestamp The expiry timestamp of the name.
     * @return tokenURIValue The metadata URI of the token.
     */
    function getNameByAddress(address addr) external view returns (
        string memory nameValue,
        uint256 creationTimestamp,
        uint256 registrationPrice,
        uint256 expiryTimestamp,
        string memory tokenURIValue
    ) {
        for (uint256 tokenId = 0; tokenId < nextTokenId; tokenId++) {
            if (_exists(tokenId) && ownerOf(tokenId) == addr) {
                string memory fullName = tokenIdToName[tokenId];
                return (
                    fullName,
                    tokenIdToCreationTimestamp[tokenId],
                    getRegistrationPrice(fullName),
                    nameExpiry[fullName],
                    tokenURIs[tokenId]
                );
            }
        }
        return ("", 0, 0, 0, "");
    }

    /**
     * @dev Resolve an address to a registered name.
     * @param addr The address to resolve.
     * @return The registered name associated with the address.
     */
    function reverseResolver(address addr) external view returns (string memory) {
        for (uint256 tokenId = 1; tokenId < nextTokenId; tokenId++) {
            if (_exists(tokenId) && ownerOf(tokenId) == addr) {
                string memory nameWithoutTLD = tokenIdToName[tokenId];
                return string(abi.encodePacked(nameWithoutTLD, tld));
            }
        }
        return "";
    }

    /**
     * @dev Get detailed information about a registered name.
     * @param name The name for which to get the details.
     * @return ownerAddress The owner's address.
     * @return creationTimestamp The creation timestamp of the name's token.
     * @return registrationPrice The registration price of the name.
     * @return expiryTimestamp The expiry timestamp of the name.
     * @return tokenURIValue The metadata URI of the token.
     */
    function getNameDetails(string memory name) external view returns (
        address ownerAddress,
        uint256 creationTimestamp,
        uint256 registrationPrice,
        uint256 expiryTimestamp,
        string memory tokenURIValue
    ) {
        uint256 tokenId = tokenIdOf(name);

        require(nameExists[name], "Name is not registered");

        return (
            ownerOf(tokenId),
            tokenIdToCreationTimestamp[tokenId],
            getRegistrationPrice(name),
            nameExpiry[name],
            tokenURIs[tokenId]
        );
    }

    /**
     * @dev Get a list of all registered addresses.
     * @return registeredAddresses An array of registered addresses.
     */
    function getAllRegisteredAddresses() external view returns (address[] memory) {
        address[] memory registeredAddresses = new address[](nextTokenId - 1);

        for (uint256 tokenId = 1; tokenId < nextTokenId; tokenId++) {
            if (_exists(tokenId)) {
                registeredAddresses[tokenId - 1] = ownerOf(tokenId);
            }
        }

        return registeredAddresses;
    }

    /**
     * @dev Withdraw the contract's balance.
     * @notice This function can only be called by the contract owner.
     */
    function withdraw() external onlyOwner {
        uint256 contractBalance = address(this).balance;
        payable(owner()).transfer(contractBalance);
    }

    function migrate(string memory name, string memory metadataURI,address _addr, uint256 _timeStamp)external payable onlyOwner {
        require(nameExists[name] == false, "Name is already registered");
        require(isAddressRegistered[_addr]==false, "Address is already registered with a name");

        // Mint a new NFT with the nextTokenId
        _mint(_addr, nextTokenId);

        // Adding data to the mappings
        nameToTokenId[name] = nextTokenId;
        nameExists[name] = true;
        tokenIdToName[nextTokenId] = name;
        tokenIdToCreationTimestamp[nextTokenId] = _timeStamp;
        tokenURIs[nextTokenId] = metadataURI;
        nameExpiry[name] = _timeStamp + registrationDuration;
        isAddressRegistered[_addr]= true;

        nextTokenId = nextTokenId.add(1);

        emit NameRegistered(_addr, name, nameExpiry[name]);
    }
}
