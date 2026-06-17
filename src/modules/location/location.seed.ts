import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';
import { Region, RegionScope } from './entities/region.entity';

interface CityData {
  name: string;
}

interface RegionData {
  name: string;
  cities: CityData[];
}

const LOCATIONS: RegionData[] = [
  {
    name: 'Centre',
    cities: [
      { name: 'Yaoundé' },
      { name: 'Mbalmayo' },
      { name: 'Obala' },
      { name: 'Mfou' },
      { name: 'Akono' },
      { name: 'Eséka' },
      { name: 'Monatélé' },
      { name: 'Bafia' },
      { name: 'Ntui' },
      { name: 'Saa' },
    ],
  },
  {
    name: 'Littoral',
    cities: [
      { name: 'Douala' },
      { name: 'Edéa' },
      { name: 'Nkongsamba' },
      { name: 'Loum' },
      { name: 'Yabassi' },
      { name: 'Bonabéri' },
      { name: 'Dibombari' },
      { name: 'Manjo' },
      { name: 'Mbanga' },
      { name: 'Penja' },
    ],
  },
  {
    name: 'Nord Ouest',
    cities: [
      { name: 'Bamenda' },
      { name: 'Kumbo' },
      { name: 'Mbengwi' },
      { name: 'Wum' },
      { name: 'Ndop' },
      { name: 'Nkambé' },
      { name: 'Fundong' },
      { name: 'Bali' },
      { name: 'Santa' },
      { name: 'Babessi' },
    ],
  },
  {
    name: 'Sud Ouest',
    cities: [
      { name: 'Buéa' },
      { name: 'Limbé' },
      { name: 'Kumba' },
      { name: 'Mamfé' },
      { name: 'Tiko' },
      { name: 'Mutengene' },
      { name: 'Ekondo Titi' },
      { name: 'Fontem' },
      { name: 'Bakassi' },
      { name: 'Muyuka' },
    ],
  },
  {
    name: 'Nord',
    cities: [
      { name: 'Garoua' },
      { name: 'Lagdo' },
      { name: 'Guider' },
      { name: 'Poli' },
      { name: 'Figuil' },
      { name: 'Bélel' },
      { name: 'Tcholliré' },
      { name: 'Madingring' },
      { name: 'Gaschiga' },
      { name: 'Mayo Oulo' },
    ],
  },
  {
    name: 'Extrême Nord',
    cities: [
      { name: 'Maroua' },
      { name: 'Mokolo' },
      { name: 'Kousséri' },
      { name: 'Yagoua' },
      { name: 'Mora' },
      { name: 'Bogo' },
      { name: 'Kaélé' },
      { name: 'Méri' },
      { name: 'Moutourwa' },
      { name: 'Magada' },
    ],
  },
  {
    name: 'Sud',
    cities: [
      { name: 'Ebolowa' },
      { name: 'Sangmélima' },
      { name: 'Kribi' },
      { name: 'Ambam' },
      { name: 'Djoum' },
      { name: 'Mvangan' },
      { name: 'Mintom' },
      { name: 'Ma\'an' },
      { name: 'Oveng' },
      { name: 'Bipindi' },
    ],
  },
  {
    name: 'Ouest',
    cities: [
      { name: 'Bafoussam' },
      { name: 'Dschang' },
      { name: 'Foumbot' },
      { name: 'Mbouda' },
      { name: 'Baham' },
      { name: 'Batié' },
      { name: 'Bandjoun' },
      { name: 'Foumban' },
      { name: 'Kékem' },
      { name: 'Tonga' },
    ],
  },
  {
    name: 'Adamaoua',
    cities: [
      { name: 'Ngaoundéré' },
      { name: 'Tibati' },
      { name: 'Tignère' },
      { name: 'Meiganga' },
      { name: 'Banyo' },
      { name: 'Ngaoundal' },
      { name: 'Martap' },
      { name: 'Dir' },
      { name: 'Belel' },
      { name: 'Nyambaka' },
    ],
  },
  {
    name: 'Est',
    cities: [
      { name: 'Bertoua' },
      { name: 'Abong-Mbang' },
      { name: 'Batouri' },
      { name: 'Yokadouma' },
      { name: 'Bétaré-Oya' },
      { name: 'Bélabo' },
      { name: 'Garoua-Boulaï' },
      { name: 'Ndelele' },
      { name: 'Mbang' },
      { name: 'Kette' },
    ],
  },
];

@Injectable()
export class LocationSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(LocationSeed.name);

  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async onApplicationBootstrap() {
    // Seed automatique si aucune région n'existe
    const regionCount = await this.regionRepository.count();
    if (regionCount > 0) return;

    this.logger.log('Seeding locations...');

    for (const regionData of LOCATIONS) {
      const region = this.regionRepository.create({
        name: regionData.name,
        scope: RegionScope.GLOBAL,
      });
      const savedRegion = await this.regionRepository.save(region);

      for (const cityData of regionData.cities) {
        const city = this.cityRepository.create({
          name: cityData.name,
          regionId: savedRegion.id,
        });
        await this.cityRepository.save(city);
      }

      this.logger.log(`  Region: ${regionData.name} (${regionData.cities.length} cities)`);
    }

    this.logger.log('Locations seeded.');
  }
}
