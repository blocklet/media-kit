const DID = 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9';
const WELL_KNOWN_SERVICE_PATH = '/.well-known/service';
const RESOURCE_TYPE = 'imgpack';

export const COMPONENT_DID = DID;
export const PROJECT_PAGE_PATH = `${WELL_KNOWN_SERVICE_PATH}/embed/resources/${DID}/publish`;
export const ADD_RESOURCE_PAGE_PATH = `${WELL_KNOWN_SERVICE_PATH}/embed/resources/${DID}/add?resourceType=${RESOURCE_TYPE}`;
export const RESOURCE_API_PATH = `${WELL_KNOWN_SERVICE_PATH}/api/resources?resourceType=${RESOURCE_TYPE}`;
export { RESOURCE_TYPE };
